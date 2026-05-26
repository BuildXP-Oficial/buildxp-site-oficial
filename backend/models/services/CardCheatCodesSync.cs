using System.Net;
using System.Text.RegularExpressions;
using BuildXP.API.Data;
using BuildXP.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BuildXP.API.Services;

/// <summary>
/// Repõe cheat codes (ReferenciasRapidas) a partir de <c>wwwroot/data/cheat-html/{slug}.html</c>
/// quando o card na BD ainda não tem referências.
/// </summary>
public static class CardCheatCodesSync
{
    private static readonly Dictionary<string, string[]> FileSlugToCardSlugs = new(StringComparer.OrdinalIgnoreCase)
    {
        ["api"] = ["api", "integrandoumaapi"],
    };

    public static async Task SincronizarSeVazioAsync(AppDbContext db, string webRootPath, CancellationToken ct = default)
    {
        var dir = Path.Combine(webRootPath, "data", "cheat-html");
        if (!Directory.Exists(dir)) return;

        foreach (var file in Directory.EnumerateFiles(dir, "*.html"))
        {
            var fileSlug = Path.GetFileNameWithoutExtension(file);
            if (string.IsNullOrWhiteSpace(fileSlug)) continue;

            var cardSlugs = FileSlugToCardSlugs.TryGetValue(fileSlug, out var aliases)
                ? aliases
                : [fileSlug];

            var html = await File.ReadAllTextAsync(file, ct);
            var parsed = ParseCheatHtml(html);
            if (parsed.Count == 0) continue;

            foreach (var cardSlug in cardSlugs)
            {
                var normalized = cardSlug.Trim().ToLowerInvariant();
                var card = await db.SkillCards
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Slug.ToLower() == normalized, ct);
                if (card is null) continue;

                var jaTem = await db.ReferenciasRapidas.AnyAsync(r => r.CardId == card.Id, ct);
                if (jaTem) continue;

                foreach (var r in parsed)
                {
                    db.ReferenciasRapidas.Add(new ReferenciaRapida
                    {
                        CardId = card.Id,
                        Categoria = Trunc(r.Categoria, 50),
                        Comando = Trunc(r.Comando, 200),
                        Descricao = Trunc(r.Descricao, 200),
                        OrdemCategoria = r.OrdemCategoria,
                        OrdemItem = r.OrdemItem,
                    });
                }

                await db.SaveChangesAsync(ct);
            }
        }
    }

    internal static List<ParsedRef> ParseCheatHtml(string html)
    {
        var list = new List<ParsedRef>();
        if (string.IsNullOrWhiteSpace(html)) return list;

        var chunks = Regex.Split(html, @"<div\s+class=""ref-section"">", RegexOptions.IgnoreCase);
        var ordemCat = 0;
        foreach (var chunk in chunks.Skip(1))
        {
            var titleMatch = Regex.Match(
                chunk,
                @"<div\s+class=""ref-section-title"">([^<]*)</div>",
                RegexOptions.IgnoreCase);
            var categoria = titleMatch.Success
                ? Decode(titleMatch.Groups[1].Value.Trim())
                : "GERAL";
            if (string.IsNullOrWhiteSpace(categoria)) categoria = "GERAL";

            ordemCat++;
            var itemRx = new Regex(
                @"<span\s+class=""cmd-text"">([\s\S]*?)</span>\s*<span\s+class=""cmd-desc"">([\s\S]*?)</span>",
                RegexOptions.IgnoreCase);
            var ordemItem = 0;
            foreach (Match m in itemRx.Matches(chunk))
            {
                var comando = Decode(m.Groups[1].Value.Trim());
                var descricao = Decode(m.Groups[2].Value.Trim());
                if (string.IsNullOrWhiteSpace(comando)) continue;
                ordemItem++;
                list.Add(new ParsedRef(categoria, comando, descricao, ordemCat, ordemItem));
            }
        }

        return list;
    }

    private static string Decode(string s) => WebUtility.HtmlDecode(s);

    private static string Trunc(string value, int max) =>
        value.Length <= max ? value : value[..max];

    internal sealed record ParsedRef(
        string Categoria,
        string Comando,
        string Descricao,
        int OrdemCategoria,
        int OrdemItem);
}
