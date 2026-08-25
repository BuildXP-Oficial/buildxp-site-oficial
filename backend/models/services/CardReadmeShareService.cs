using System.Text.Json.Serialization;
using BuildXP.API.Data;
using BuildXP.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BuildXP.API.Services;

public record CardReadmeShareDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("nome")] string Nome,
    [property: JsonPropertyName("githubLink")] string GithubLink);

public record CardReadmeShareCreatedDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("nome")] string Nome,
    [property: JsonPropertyName("githubLink")] string GithubLink,
    [property: JsonPropertyName("ownerToken")] Guid OwnerToken);

public class CardReadmeShareService
{
    private readonly AppDbContext _db;

    public CardReadmeShareService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<CardReadmeShareDto>> ListarAsync(string? slug, CancellationToken ct = default)
    {
        var sl = (slug ?? string.Empty).Trim().ToLowerInvariant();
        var q = _db.CardReadmeShares.AsNoTracking();
        if (!string.IsNullOrEmpty(sl))
            q = q.Where(x => x.CardId == null || (x.Card != null && x.Card.Slug == sl));
        return await q
            .OrderByDescending(x => x.CriadoEm)
            .ThenByDescending(x => x.Id)
            .Select(x => new CardReadmeShareDto(x.Id, x.Nome, x.GithubLink))
            .ToListAsync(ct);
    }

    public async Task<(CardReadmeShareCreatedDto? Item, string? Erro)> CriarAsync(
        string? slug,
        string nome,
        string link,
        CancellationToken ct = default)
    {
        var sl = (slug ?? string.Empty).Trim().ToLowerInvariant();
        SkillCard? card = null;
        if (!string.IsNullOrEmpty(sl))
        {
            card = await _db.SkillCards.FirstOrDefaultAsync(c => c.Slug == sl, ct);
            if (card is null)
                return (null, "Card não encontrado.");
        }

        var n = (nome ?? string.Empty).Trim();
        var urlInName = System.Text.RegularExpressions.Regex.Match(n, @"https?://\S+", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (urlInName.Success)
        {
            n = n.Replace(urlInName.Value, "", StringComparison.OrdinalIgnoreCase).Trim();
            if (string.IsNullOrWhiteSpace(link))
                link = urlInName.Value;
        }
        if (n.Length < 2)
            return (null, "Informe um nome (mínimo 2 caracteres).");
        if (n.Length > 80)
            n = n[..80];

        var l = (link ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(l))
            return (null, "Informe o link do GitHub.");
        if (!l.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
            !l.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            l = "https://" + l;
        if (!Uri.TryCreate(l, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            return (null, "Link inválido.");
        if (!uri.Host.Contains("github.com", StringComparison.OrdinalIgnoreCase))
            return (null, "Use um link do GitHub.");
        if (uri.AbsoluteUri.Length > 500)
            return (null, "Link muito longo.");

        var github = uri.AbsoluteUri;
        var token = Guid.NewGuid();
        var existing = await _db.CardReadmeShares.FirstOrDefaultAsync(x => x.GithubLink == github, ct);
        if (existing is not null)
        {
            existing.Nome = n;
            existing.OwnerToken = token;
            if (card is not null && existing.CardId is null)
                existing.CardId = card.Id;
            await _db.SaveChangesAsync(ct);
            return (new CardReadmeShareCreatedDto(existing.Id, existing.Nome, existing.GithubLink, token), null);
        }

        var row = new CardReadmeShare
        {
            CardId = card?.Id,
            Nome = n,
            GithubLink = github,
            OwnerToken = token,
            CriadoEm = DateTime.UtcNow,
        };
        _db.CardReadmeShares.Add(row);
        await _db.SaveChangesAsync(ct);
        return (new CardReadmeShareCreatedDto(row.Id, row.Nome, row.GithubLink, token), null);
    }

    public async Task<(bool Ok, string? Erro)> RemoverAsync(int id, CancellationToken ct = default)
    {
        var row = await _db.CardReadmeShares.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (row is null)
            return (true, null);

        _db.CardReadmeShares.Remove(row);
        await _db.SaveChangesAsync(ct);
        return (true, null);
    }
}
