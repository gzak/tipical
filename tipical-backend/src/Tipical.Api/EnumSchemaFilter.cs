using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Tipical.Api;

/// <summary>Annotates integer-backed enum schemas with member names so Swagger UI shows human-readable values.</summary>
public class EnumSchemaFilter : ISchemaFilter
{
    public void Apply(IOpenApiSchema schema, SchemaFilterContext context)
    {
        if (!context.Type.IsEnum) return;

        var annotation = string.Join(", ", Enum.GetValues(context.Type)
            .Cast<Enum>()
            .Select(v => $"{Convert.ToInt32(v)} = {v}"));
        schema.Description = string.IsNullOrEmpty(schema.Description)
            ? annotation
            : $"{schema.Description} ({annotation})";
    }
}
