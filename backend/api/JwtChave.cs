using System.Text;

namespace BuildXP.API;

internal static class JwtChave
{
    internal const string PlaceholderAntigo = "buildxp-chave-super-secreta-minimo-32-caracteres";

    internal static string Exigir(string? chave)
    {
        var jwtChave = (chave ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(jwtChave)
            || string.Equals(jwtChave, PlaceholderAntigo, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Jwt:Chave não está configurada. Defina User Secrets (dotnet user-secrets set \"Jwt:Chave\" \"...\") ou a variável Jwt__Chave. A chave antiga versionada não é mais aceita.");
        }

        if (Encoding.UTF8.GetByteCount(jwtChave) < 32)
            throw new InvalidOperationException("Jwt:Chave deve ter pelo menos 32 caracteres.");

        return jwtChave;
    }
}
