using System.Linq.Expressions;
using Google.Api.Gax.Grpc;

namespace Tipical.Infrastructure;

public static class FieldMask
{
    public static FieldMaskRoot<TRoot> For<TRoot>() => new();
}

public sealed class FieldMaskRoot<TRoot>
{
    private readonly HashSet<string> _pathSet = [];
    private readonly List<string> _pathList = [];

    public FieldMaskNode<TRoot, TElement> Include<TElement>(
        Expression<Func<TRoot, IEnumerable<TElement>>> selector)
    {
        var path = GetMemberName(selector.Body);
        return new FieldMaskNode<TRoot, TElement>(this, path);
    }

    public string Build() => string.Join(',', _pathList);

    public CallSettings ToCallSettings() =>
        CallSettings.FromHeader("X-Goog-FieldMask", Build());

    internal void AddPath(string path)
    {
        if (_pathSet.Add(path))
            _pathList.Add(path);
    }

    internal static string GetMemberName(Expression expr)
    {
        if (expr is UnaryExpression { NodeType: ExpressionType.Convert } unary)
            expr = unary.Operand;

        var parts = new List<string>();
        while (expr is MemberExpression member)
        {
            parts.Add(ToProtoName(member.Member.Name));
            expr = member.Expression!;
        }

        if (parts.Count == 0)
            throw new ArgumentException($"Expected a member access expression, got {expr.NodeType}");

        parts.Reverse();
        return string.Join('.', parts);
    }

    internal static string ToProtoName(string name) =>
        name.EndsWith('_')
            ? char.ToLowerInvariant(name[0]) + name[1..^1]
            : char.ToLowerInvariant(name[0]) + name[1..];
}

public sealed class FieldMaskNode<TRoot, TCurrent>
{
    private readonly FieldMaskRoot<TRoot> _root;
    private readonly string _currentPath;
    private readonly bool _hasUncommittedPath;

    internal FieldMaskNode(FieldMaskRoot<TRoot> root, string currentPath, bool hasUncommittedPath = false)
    {
        _root = root;
        _currentPath = currentPath;
        _hasUncommittedPath = hasUncommittedPath;
    }

    public FieldMaskNode<TRoot, TNext> ThenInclude<TNext>(Expression<Func<TCurrent, TNext>> selector)
    {
        // Do NOT commit _currentPath — further ThenInclude means we're still navigating,
        // not selecting this node as a leaf.
        if (selector.Body is NewExpression newExpr)
        {
            foreach (var arg in newExpr.Arguments)
                _root.AddPath($"{_currentPath}.{FieldMaskRoot<TRoot>.GetMemberName(arg)}");
            return new FieldMaskNode<TRoot, TNext>(_root, _currentPath);
        }

        var memberPath = FieldMaskRoot<TRoot>.GetMemberName(selector.Body);
        return new FieldMaskNode<TRoot, TNext>(_root, $"{_currentPath}.{memberPath}", hasUncommittedPath: true);
    }

    public FieldMaskNode<TRoot, TElement> Include<TElement>(
        Expression<Func<TRoot, IEnumerable<TElement>>> selector)
    {
        CommitIfNeeded();
        return _root.Include(selector);
    }

    public string Build()
    {
        CommitIfNeeded();
        return _root.Build();
    }

    public CallSettings ToCallSettings()
    {
        CommitIfNeeded();
        return _root.ToCallSettings();
    }

    private void CommitIfNeeded()
    {
        if (_hasUncommittedPath)
            _root.AddPath(_currentPath);
    }
}
