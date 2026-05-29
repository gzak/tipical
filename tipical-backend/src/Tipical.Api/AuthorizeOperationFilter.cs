using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Reflection;

namespace Tipical.Api;

/// <summary>Clears the Bearer security requirement for endpoints not marked with [Authorize], so the lock icon only appears on protected endpoints.</summary>
public class AuthorizeOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var hasAuthorize = context.MethodInfo.GetCustomAttributes<AuthorizeAttribute>(true).Any()
            || (context.MethodInfo.DeclaringType?.GetCustomAttributes<AuthorizeAttribute>(true).Any() ?? false);
        if (!hasAuthorize)
            operation.Security = [];
    }
}
