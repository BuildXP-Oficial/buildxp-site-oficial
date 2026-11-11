using BuildXP.API.Data;
using BuildXP.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BuildXP.API.Services;

public record FaixaColaboradorDto(int Id, string Nome, string Icone, string Link, int Ordem);

public class FaixaColaboradorService
{
    private readonly AppDbContext _db;

    public FaixaColaboradorService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<FaixaColaboradorDto>> ListarAsync(CancellationToken ct = default)
    {
        return await _db.FaixaColaboradores
            .AsNoTracking()
            .OrderBy(x => x.Ordem)
            .ThenBy(x => x.Id)
            .Select(x => new FaixaColaboradorDto(x.Id, x.Nome, x.Icone, x.Link, x.Ordem))
            .ToListAsync(ct);
    }

    public async Task<(FaixaColaboradorDto? Item, string? Erro)> CriarAsync(
        string nome,
        string icone,
        string link,
        CancellationToken ct = default)
    {
        var (nomeOk, iconeOk, linkOk, erro) = Normalizar(nome, icone, link);
        if (erro is not null)
            return (null, erro);

        var maxOrdem = await _db.FaixaColaboradores.MaxAsync(x => (int?)x.Ordem, ct) ?? 0;
        var row = new FaixaColaborador
        {
            Nome = nomeOk,
            Icone = iconeOk,
            Link = linkOk,
            Ordem = maxOrdem + 1,
            CriadoEm = DateTime.UtcNow,
        };
        _db.FaixaColaboradores.Add(row);
        await _db.SaveChangesAsync(ct);
        return (new FaixaColaboradorDto(row.Id, row.Nome, row.Icone, row.Link, row.Ordem), null);
    }

    public async Task<(FaixaColaboradorDto? Item, string? Erro)> AtualizarAsync(
        int id,
        string nome,
        string icone,
        string link,
        CancellationToken ct = default)
    {
        var row = await _db.FaixaColaboradores.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (row is null)
            return (null, "Contribuidor não encontrado.");

        var (nomeOk, iconeOk, linkOk, erro) = Normalizar(nome, icone, link);
        if (erro is not null)
            return (null, erro);

        row.Nome = nomeOk;
        row.Icone = iconeOk;
        row.Link = linkOk;
        await _db.SaveChangesAsync(ct);
        return (new FaixaColaboradorDto(row.Id, row.Nome, row.Icone, row.Link, row.Ordem), null);
    }

    public async Task<(bool Ok, string? Erro)> ExcluirAsync(int id, CancellationToken ct = default)
    {
        var row = await _db.FaixaColaboradores.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (row is null)
            return (false, "Contribuidor não encontrado.");
        _db.FaixaColaboradores.Remove(row);
        await _db.SaveChangesAsync(ct);
        return (true, null);
    }

    private static (string Nome, string Icone, string Link, string? Erro) Normalizar(
        string nome,
        string icone,
        string link)
    {
        var n = (nome ?? string.Empty).Trim();
        if (n.Length < 2)
            return ("", "", "", "Informe o nome (mínimo 2 caracteres).");
        if (n.Length > 80)
            n = n[..80];

        var i = (icone ?? string.Empty).Trim().ToLowerInvariant();
        if (i is not "github" and not "linkedin")
            return ("", "", "", "Ícone deve ser github ou linkedin.");

        var l = (link ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(l))
            return ("", "", "", "Informe o link.");
        if (!l.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
            !l.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            l = "https://" + l;
        if (!Uri.TryCreate(l, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            return ("", "", "", "Link inválido. Use uma URL http ou https.");
        if (l.Length > 500)
            return ("", "", "", "Link muito longo.");

        return (n, i, uri.AbsoluteUri, null);
    }
}
