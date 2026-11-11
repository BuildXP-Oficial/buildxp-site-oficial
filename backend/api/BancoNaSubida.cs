using BuildXP.API.Data;
using BuildXP.API.Services;
using Microsoft.EntityFrameworkCore;

namespace BuildXP.API;

internal static class BancoNaSubida
{
    internal const string ConexaoSentinelaDesenvolvimento =
        "Host=127.0.0.1;Port=1;Database=buildxp_sem_connection_string;Username=none;Password=none";

    internal static bool TemConnectionString(string? connectionString) =>
        !string.IsNullOrWhiteSpace(connectionString);

    internal static bool DevePreparar(string? connectionString) =>
        string.Equals(Environment.GetEnvironmentVariable("BUILDXP_SKIP_DB"), "1", StringComparison.Ordinal) is false
        && TemConnectionString(connectionString);

    /// <summary>GET público de cards usa <see cref="CatalogoEstatico"/> em vez do PostgreSQL.</summary>
    internal static bool UsarCatalogoEstatico(string? connectionString) =>
        !DevePreparar(connectionString);

    internal static string ParaEf(string? connectionString, bool desenvolvimento)
    {
        if (TemConnectionString(connectionString))
            return connectionString!.Trim();

        if (desenvolvimento)
            return ConexaoSentinelaDesenvolvimento;

        throw new InvalidOperationException(
            "ConnectionStrings:DefaultConnection não está configurada. Defina User Secrets ou a variável ConnectionStrings__DefaultConnection.");
    }

    internal static async Task PrepararAsync(IServiceProvider services, string? connectionString, string webRootPath)
    {
        if (!DevePreparar(connectionString))
            return;

        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        var cardService = scope.ServiceProvider.GetRequiredService<CardService>();
        await cardService.FixDuplicateStaticIconPathsAsync();
        await cardService.FixCheapCodesBrandingAsync();
        await cardService.FixPublicCardLinksAsync();
        await CardCheatCodesSync.SincronizarSeVazioAsync(db, webRootPath);
    }
}
