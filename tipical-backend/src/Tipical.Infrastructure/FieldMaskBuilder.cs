using System.Linq.Expressions;
using Google.Api.Gax.Grpc;
using Google.Protobuf.Collections;

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
        Expression<Func<TRoot, RepeatedField<TElement>>> selector)
    {
        var path = GetMemberName(selector.Body);
        return new FieldMaskNode<TRoot, TElement>(this, path);
    }

    public FieldMaskNode<TRoot, TElement> Include<TElement>(Expression<Func<TRoot, TElement>> selector)
    {
        if (selector.Body is NewExpression newExpr)
        {
            foreach (var arg in newExpr.Arguments)
                AddPath(GetMemberName(arg));
            return new FieldMaskNode<TRoot, TElement>(this, string.Empty);
        }

        var path = GetMemberName(selector.Body);
        AddPath(path);
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
        var parts = new Stack<string>();
        while (expr is MemberExpression member)
        {
            parts.Push(ToProtoName(member.Member.Name));
            expr = member.Expression!;
        }

        if (parts.Count == 0)
            throw new ArgumentException($"Expected a member access expression, got {expr.NodeType}");

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

    public FieldMaskNode<TRoot, TElement> ThenInclude<TElement>(Expression<Func<TCurrent, RepeatedField<TElement>>> selector)
    {
        CommitIfNeeded();
        var memberPath = FieldMaskRoot<TRoot>.GetMemberName(selector.Body);
        var path = string.IsNullOrEmpty(_currentPath) ? memberPath : $"{_currentPath}.{memberPath}";
        return new FieldMaskNode<TRoot, TElement>(_root, path);
    }

    public FieldMaskNode<TRoot, TNext> ThenInclude<TNext>(Expression<Func<TCurrent, TNext>> selector)
    {
        if (selector.Body is NewExpression newExpr)
        {
            foreach (var arg in newExpr.Arguments)
            {
                var memberName = FieldMaskRoot<TRoot>.GetMemberName(arg);
                _root.AddPath(string.IsNullOrEmpty(_currentPath) ? memberName : $"{_currentPath}.{memberName}");
            }
            return new FieldMaskNode<TRoot, TNext>(_root, _currentPath);
        }

        var memberPath = FieldMaskRoot<TRoot>.GetMemberName(selector.Body);
        var path = string.IsNullOrEmpty(_currentPath) ? memberPath : $"{_currentPath}.{memberPath}";
        return new FieldMaskNode<TRoot, TNext>(_root, path, hasUncommittedPath: true);
    }

    public FieldMaskNode<TRoot, TElement> Include<TElement>(
        Expression<Func<TRoot, RepeatedField<TElement>>> selector)
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
