using BuildXP.API.Models.Dtos;
using Microsoft.AspNetCore.Hosting;

namespace BuildXP.API.Services;

/// <summary>
/// Cards públicos a partir de <c>wwwroot/data/cheat-html</c>, quando o PostgreSQL não está configurado.
/// </summary>
public sealed class CatalogoEstatico
{
    private readonly string _webRootPath;

    public CatalogoEstatico(IWebHostEnvironment env)
        : this(env.WebRootPath)
    {
    }

    public CatalogoEstatico(string webRootPath)
    {
        _webRootPath = webRootPath ?? string.Empty;
    }

    public IReadOnlyList<CardClientDto> Listar() =>
        Metadados.Select(m => Montar(m, incluirReferencias: false)).ToList();

    public CardClientDto? BuscarPorSlug(string? slug)
    {
        var chave = (slug ?? string.Empty).Trim().ToLowerInvariant();
        if (chave is "integrandoumaapi") chave = "api";
        var meta = Metadados.FirstOrDefault(m => m.Slug == chave);
        return meta is null ? null : Montar(meta, incluirReferencias: true);
    }

    private CardClientDto Montar(CardEstaticoMeta meta, bool incluirReferencias)
    {
        var dto = new CardClientDto
        {
            Id = meta.Id,
            Slug = meta.Slug,
            Theme = meta.Theme,
            BorderColor = CardCampos.CorParaTema(meta.Theme),
            DisplayName = meta.Titulo,
            RarityLabel = meta.Raridade,
            CardClass = meta.Classe,
            DescriptionHtml = meta.Descricao,
            LinkBeginner = CardClientDto.NormalizePublicListLink(string.Empty, meta.Slug, "beginner"),
            LinkRef = CardClientDto.NormalizePublicListLink(string.Empty, meta.Slug, "ref"),
            XpCurrent = meta.XpAtual,
            XpMax = 3000,
            SortOrder = meta.Ordem,
            BtnPrimaryLabel = "▶ COMEÇAR",
            BtnSecondaryLabel = "🎮 CHEAP CODES",
            IconLayout = meta.IconeSecundario is null ? "single" : "dual",
            IconPrimarySrc = meta.Icone,
            IconPrimaryAlt = meta.Titulo,
            IconSecondarySrc = meta.IconeSecundario ?? string.Empty,
            IconSecondaryAlt = meta.IconeSecundarioAlt ?? string.Empty,
            IsPublished = true,
        };

        if (incluirReferencias)
            dto.Referencias = CarregarReferencias(meta.ArquivoHtml);

        return dto;
    }

    private List<ReferenciaClientDto> CarregarReferencias(string arquivoHtml)
    {
        var path = Path.Combine(_webRootPath, "data", "cheat-html", arquivoHtml);
        if (!File.Exists(path))
            return [];

        var html = File.ReadAllText(path);
        var parsed = CardCheatCodesSync.ParseCheatHtml(html);
        var id = 1;
        return parsed.Select(r => new ReferenciaClientDto
        {
            Id = id++,
            Categoria = r.Categoria,
            OrdemCategoria = r.OrdemCategoria,
            Comando = r.Comando,
            Descricao = r.Descricao,
            OrdemItem = r.OrdemItem,
        }).ToList();
    }

    private static readonly CardEstaticoMeta[] Metadados =
    [
        new(1, "git", "git", "Git & GitHub", "ESSENTIAL", "VERSION CONTROL",
            "Do primeiro git init até branches, PRs e fluxos avançados.",
            "imagens/gitlogobr.png", "imagens/githublogo.png", "GitHub", 10, 2400, "git.html"),
        new(2, "docker", "docker", "Docker", "CORE", "CONTAINERIZATION",
            "Containers, imagens, Dockerfile e Docker Compose.",
            "imagens/dockerlogo.png", null, null, 20, 1800, "docker.html"),
        new(3, "npm", "npm", "NPM", "CORE", "PACKAGE MANAGER",
            "Pacotes, scripts e dependências de projetos Node.js.",
            "imagens/npmlogo.png", null, null, 30, 1200, "npm.html"),
        new(4, "dotnet", "dotnet", ".NET / dotnet", "SPECIALIST", "RUNTIME & CLI",
            "CLI do .NET para criar, buildar, testar e publicar projetos.",
            "imagens/csharplogo.png", null, null, 40, 900, "dotnet.html"),
        new(5, "python", "python", "Python", "CORE", "LANGUAGE",
            "Pip, pandas e o fluxo do dia a dia. Cheap codes para quem já usa e esquece o comando.",
            "imagens/PYTHON.png", null, null, 50, 1500, "python.html"),
        new(6, "api", "api", "APIs", "CORE", "INTEGRATION",
            "HTTP, REST e como integrar uma API, com cheap codes copiáveis.",
            "imagens/API.png", null, null, 60, 1100, "api.html"),
        new(7, "ia", "ia", "IA", "CORE", "AI TOOLING",
            "Vocabulário e atalhos úteis para o dia a dia com IA no fluxo de dev.",
            "imagens/ia.png", null, null, 70, 800, "ia.html"),
    ];

    private sealed record CardEstaticoMeta(
        int Id,
        string Slug,
        string Theme,
        string Titulo,
        string Raridade,
        string Classe,
        string Descricao,
        string Icone,
        string? IconeSecundario,
        string? IconeSecundarioAlt,
        int Ordem,
        int XpAtual,
        string ArquivoHtml);
}
