namespace Tipical.Infrastructure.Tests;

public class FieldMaskBuilderTests
{
    private sealed class TestResponse
    {
        public List<TestItem> Items { get; set; } = [];
        public TestParent Parent { get; set; } = new();
    }

    private sealed class TestParent
    {
        public List<TestItem> Items { get; set; } = [];
    }

    private sealed class TestItem
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public string Types_ { get; set; } = "";
        public TestSub Sub { get; set; } = new();
    }

    private sealed class TestSub
    {
        public string Text { get; set; } = "";
        public string LanguageCode { get; set; } = "";
        public TestDeep Deep { get; set; } = new();
    }

    private sealed class TestDeep
    {
        public string Value { get; set; } = "";
    }

    [Fact]
    public void FlatLeafSelection()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Id, i.Name })
            .Build();

        Assert.Equal("items.id,items.name", mask);
    }

    [Fact]
    public void SingleMemberNavigation_ThenFlatSelection()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => i.Sub)
            .ThenInclude(s => new { s.Text, s.LanguageCode })
            .Build();

        Assert.Equal("items.sub.text,items.sub.languageCode", mask);
    }

    [Fact]
    public void MultiLevel_SingleMember_ThenInclude()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => i.Sub.Text)
            .Build();

        Assert.Equal("items.sub.text", mask);
    }

    [Fact]
    public void MultiLevel_SingleMember_ThenInclude_ArbitraryDepth()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => i.Sub.Deep.Value)
            .Build();

        Assert.Equal("items.sub.deep.value", mask);
    }

    [Fact]
    public void MultiLevel_AnonymousObject_SameParent()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Sub.Text, i.Sub.LanguageCode })
            .Build();

        Assert.Equal("items.sub.text,items.sub.languageCode", mask);
    }

    [Fact]
    public void MultiLevel_AnonymousObject_DifferentParents()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Sub.Text, i.Name })
            .Build();

        Assert.Equal("items.sub.text,items.name", mask);
    }

    [Fact]
    public void MultiLevel_Include()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Parent.Items)
            .ThenInclude(i => new { i.Id, i.Name })
            .Build();

        Assert.Equal("parent.items.id,parent.items.name", mask);
    }

    [Fact]
    public void ReInclude_Branching()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Id })
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Sub.Text, i.Sub.LanguageCode })
            .Build();

        Assert.Equal("items.id,items.sub.text,items.sub.languageCode", mask);
    }

    [Fact]
    public void Deduplication()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Id, i.Name })
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Name, i.Id })  // both already added
            .Build();

        Assert.Equal("items.id,items.name", mask);
    }

    [Fact]
    public void ProtoName_TrailingUnderscore_Stripped()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Types_ })
            .Build();

        Assert.Equal("items.types", mask);
    }

    [Fact]
    public void ProtoName_PascalCase_ToCamelCase()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Sub.LanguageCode })
            .Build();

        Assert.Equal("items.sub.languageCode", mask);
    }
}
