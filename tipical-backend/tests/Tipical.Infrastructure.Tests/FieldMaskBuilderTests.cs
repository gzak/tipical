using Google.Protobuf.Collections;

namespace Tipical.Infrastructure.Tests;

public class FieldMaskBuilderTests
{
    private sealed class TestResponse
    {
        public RepeatedField<TestItem> Items { get; set; } = [];
        public TestParent Parent { get; set; } = new();
    }

    private sealed class TestParent
    {
        public RepeatedField<TestItem> Items { get; set; } = [];
    }

    private sealed class TestItem
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public string Types_ { get; set; } = "";
        public TestSub Sub { get; set; } = new();
        public RepeatedField<TestSub> SubItems { get; set; } = [];
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

    [Test]
    public async Task FlatLeafSelection()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Id, i.Name })
            .Build();

        await Assert.That(mask).IsEqualTo("items.id,items.name");
    }

    [Test]
    public async Task SingleMemberNavigation_ThenFlatSelection()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => i.Sub)
            .ThenInclude(s => new { s.Text, s.LanguageCode })
            .Build();

        await Assert.That(mask).IsEqualTo("items.sub.text,items.sub.languageCode");
    }

    [Test]
    public async Task MultiLevel_SingleMember_ThenInclude()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => i.Sub.Text)
            .Build();

        await Assert.That(mask).IsEqualTo("items.sub.text");
    }

    [Test]
    public async Task MultiLevel_SingleMember_ThenInclude_ArbitraryDepth()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => i.Sub.Deep.Value)
            .Build();

        await Assert.That(mask).IsEqualTo("items.sub.deep.value");
    }

    [Test]
    public async Task MultiLevel_AnonymousObject_SameParent()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Sub.Text, i.Sub.LanguageCode })
            .Build();

        await Assert.That(mask).IsEqualTo("items.sub.text,items.sub.languageCode");
    }

    [Test]
    public async Task MultiLevel_AnonymousObject_DifferentParents()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Sub.Text, i.Name })
            .Build();

        await Assert.That(mask).IsEqualTo("items.sub.text,items.name");
    }

    [Test]
    public async Task MultiLevel_Include()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Parent.Items)
            .ThenInclude(i => new { i.Id, i.Name })
            .Build();

        await Assert.That(mask).IsEqualTo("parent.items.id,parent.items.name");
    }

    [Test]
    public async Task ReInclude_Branching()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Id })
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Sub.Text, i.Sub.LanguageCode })
            .Build();

        await Assert.That(mask).IsEqualTo("items.id,items.sub.text,items.sub.languageCode");
    }

    [Test]
    public async Task Deduplication()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Id, i.Name })
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Name, i.Id })  // both already added
            .Build();

        await Assert.That(mask).IsEqualTo("items.id,items.name");
    }

    [Test]
    public async Task ProtoName_TrailingUnderscore_Stripped()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Types_ })
            .Build();

        await Assert.That(mask).IsEqualTo("items.types");
    }

    [Test]
    public async Task ProtoName_PascalCase_ToCamelCase()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => new { i.Sub.LanguageCode })
            .Build();

        await Assert.That(mask).IsEqualTo("items.sub.languageCode");
    }

    [Test]
    public async Task RootLevelScalarSelection()
    {
        var mask = FieldMask.For<TestItem>()
            .Include(i => new { i.Id, i.Name, i.Types_ })
            .Build();

        await Assert.That(mask).IsEqualTo("id,name,types");
    }

    [Test]
    public async Task NestedRepeatedField_NavigatesThroughElementType()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => r.Items)
            .ThenInclude(i => i.SubItems)
            .ThenInclude(s => new { s.Text, s.LanguageCode })
            .Build();

        await Assert.That(mask).IsEqualTo("items.subItems.text,items.subItems.languageCode");
    }

    [Test]
    public async Task ThenInclude_AfterAnonymousTypeInclude_NoLeadingDot()
    {
        var mask = FieldMask.For<TestResponse>()
            .Include(r => new { r.Parent })
            .ThenInclude(a => a.Parent)
            .ThenInclude(p => new { p.Items })
            .Build();

        await Assert.That(mask).IsEqualTo("parent,parent.items");
    }
}
