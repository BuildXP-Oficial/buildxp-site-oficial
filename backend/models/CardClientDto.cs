using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using BuildXP.API.Services;

namespace BuildXP.API.Models;

/// <summary>Formato esperado pelo dashboard e pelo JS público (snake_case).</summary>
public class CardClientDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("slug")]
    public string Slug { get; set; } = string.Empty;

    [JsonPropertyName("theme")]
    public string Theme { get; set; } = string.Empty;

    [JsonPropertyName("border_color")]
    public string BorderColor { get; set; } = string.Empty;

    [JsonPropertyName("display_name")]
    public string DisplayName { get; set; } = string.Empty;

    [JsonPropertyName("rarity_label")]
    public string RarityLabel { get; set; } = string.Empty;

    [JsonPropertyName("card_class")]
    public string CardClass { get; set; } = string.Empty;

    [JsonPropertyName("description_html")]
    public string DescriptionHtml { get; set; } = string.Empty;

    [JsonPropertyName("link_beginner")]
    public string LinkBeginner { get; set; } = string.Empty;

    [JsonPropertyName("link_ref")]
    public string LinkRef { get; set; } = string.Empty;

    [JsonPropertyName("xp_current")]
    public int XpCurrent { get; set; }

    [JsonPropertyName("xp_max")]
    public int XpMax { get; set; }

    [JsonPropertyName("sort_order")]
    public int SortOrder { get; set; }

    [JsonPropertyName("btn_primary_label")]
    public string BtnPrimaryLabel { get; set; } = string.Empty;

    [JsonPropertyName("btn_secondary_label")]
    public string BtnSecondaryLabel { get; set; } = string.Empty;

    [JsonPropertyName("icon_layout")]
    public string IconLayout { get; set; } = "single";

    [JsonPropertyName("icon_primary_src")]
    public string IconPrimarySrc { get; set; } = string.Empty;

    [JsonPropertyName("icon_primary_alt")]
    public string IconPrimaryAlt { get; set; } = string.Empty;

    [JsonPropertyName("icon_secondary_src")]
    public string? IconSecondarySrc { get; set; }

    [JsonPropertyName("icon_secondary_alt")]
    public string IconSecondaryAlt { get; set; } = string.Empty;

    [JsonPropertyName("is_published")]
    public bool IsPublished { get; set; }

    /// <summary>Slides da aba Iniciante (GET público por slug/id) — mesma ordem que no dashboard.</summary>
    [JsonPropertyName("slides")]
    public List<SlideClientDto> Slides { get; set; } = [];

    /// <summary>Cheat codes / referência rápida (GET por slug com Include).</summary>
    [JsonPropertyName("referencias")]
    public List<ReferenciaClientDto> Referencias { get; set; } = [];

    /// <summary>
    /// Converte links antigos <c>qualquer-coisa.html?tab=…</c> para <c>card.html?slug=…&amp;tab=…</c>
    /// usando o slug do card (fonte de verdade). URLs absolutas e <c>card.html</c> mantêm-se.
    /// </summary>
    public static string NormalizePublicListLink(string? link, string slug, string tab)
    {
        var sl = (slug ?? "").Trim().ToLowerInvariant();
        var t = string.Equals(tab, "ref", StringComparison.OrdinalIgnoreCase) ? "ref" : "beginner";
        var fallback = string.IsNullOrEmpty(sl) ? "" : $"card.html?slug={sl}&tab={t}";

        var l = (link ?? "").Trim();
        if (l.StartsWith("./", StringComparison.Ordinal)) l = l[2..];
        l = l.TrimStart('/');

        if (string.IsNullOrEmpty(l)) return fallback;
        if (l.StartsWith("card.html", StringComparison.OrdinalIgnoreCase)) return l;
        if (l.Contains("://", StringComparison.Ordinal)) return link!.Trim();

        // legado: integrandoumaapi.html?tab=beginner, git.html, etc.
        if (Regex.IsMatch(l, @"^[a-z0-9][a-z0-9_-]*\.html([\?#][^\s]*)?$", RegexOptions.IgnoreCase))
            return string.IsNullOrEmpty(sl) ? link!.Trim() : $"card.html?slug={sl}&tab={t}";

        return link!.Trim();
    }

    public static CardClientDto FromEntity(SkillCard c, bool forDashboardEdit = false) => new()
    {
        Id = c.Id,
        Slug = c.Slug,
        Theme = c.Theme,
        BorderColor = string.IsNullOrWhiteSpace(c.CorBorda) ? "#39d353" : c.CorBorda.Trim(),
        DisplayName = c.Titulo,
        RarityLabel = c.Raridade,
        CardClass = c.Classe,
        DescriptionHtml = c.Descricao,
        LinkBeginner = NormalizePublicListLink(c.LinkBeginner, c.Slug, "beginner"),
        LinkRef = NormalizePublicListLink(c.LinkRef, c.Slug, "ref"),
        XpCurrent = c.XpAtual,
        XpMax = c.XpMaximo,
        SortOrder = c.Ordem,
        BtnPrimaryLabel = c.BtnPrimaryLabel,
        BtnSecondaryLabel = c.BtnSecondaryLabel,
        IconLayout = string.IsNullOrEmpty(c.IconLayout) ? "single" : c.IconLayout,
        IconPrimarySrc = forDashboardEdit
            ? CardIconHelper.ResolvePrimaryStorageRef(c)
            : CardIconHelper.ResolvePrimaryPublicSrc(c),
        IconPrimaryAlt = c.IconPrimaryAlt,
        IconSecondarySrc = forDashboardEdit
            ? (string.IsNullOrEmpty(CardIconHelper.ResolveSecondaryStorageRef(c))
                ? null
                : CardIconHelper.ResolveSecondaryStorageRef(c))
            : (string.IsNullOrEmpty(CardIconHelper.ResolveSecondaryPublicSrc(c))
                ? null
                : CardIconHelper.ResolveSecondaryPublicSrc(c)),
        IconSecondaryAlt = c.IconSecondaryAlt,
        IsPublished = c.Ativo,
        Slides = (c.Slides ?? [])
            .Where(s => s.Ativo)
            .OrderBy(s => s.Ordem)
            .Select(s => new SlideClientDto
            {
                Id = s.Id,
                Ordem = s.Ordem,
                Titulo = s.Titulo ?? string.Empty,
                Descricao = s.Descricao ?? string.Empty,
                Conteudos = (s.Conteudos ?? [])
                    .OrderBy(c => c.Ordem)
                    .Select(c => new ConteudoSlideClientDto
                    {
                        Tipo = (int)c.Tipo,
                        Texto = c.Texto ?? string.Empty,
                        Descricao = c.Descricao ?? string.Empty,
                        Ordem = c.Ordem,
                    })
                    .ToList(),
            })
            .ToList(),
        Referencias = (c.Referencias ?? [])
            .OrderBy(r => r.OrdemCategoria)
            .ThenBy(r => r.OrdemItem)
            .Select(r => new ReferenciaClientDto
            {
                Id = r.Id,
                Categoria = r.Categoria ?? string.Empty,
                OrdemCategoria = r.OrdemCategoria,
                Comando = r.Comando ?? string.Empty,
                Descricao = r.Descricao ?? string.Empty,
                OrdemItem = r.OrdemItem,
            })
            .ToList(),
    };
}

public sealed class ReferenciaClientDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("categoria")]
    public string Categoria { get; set; } = string.Empty;

    [JsonPropertyName("ordem_categoria")]
    public int OrdemCategoria { get; set; }

    [JsonPropertyName("comando")]
    public string Comando { get; set; } = string.Empty;

    [JsonPropertyName("descricao")]
    public string Descricao { get; set; } = string.Empty;

    [JsonPropertyName("ordem_item")]
    public int OrdemItem { get; set; }
}

public sealed class SlideClientDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("ordem")]
    public int Ordem { get; set; }

    [JsonPropertyName("titulo")]
    public string Titulo { get; set; } = string.Empty;

    [JsonPropertyName("descricao")]
    public string Descricao { get; set; } = string.Empty;

    [JsonPropertyName("conteudos")]
    public List<ConteudoSlideClientDto> Conteudos { get; set; } = [];
}

public sealed class ConteudoSlideClientDto
{
    /// <summary>0=Comando, 1=Observacao, 2=Pausa, 3=Fim (enum TipoConteudo).</summary>
    [JsonPropertyName("tipo")]
    public int Tipo { get; set; }

    [JsonPropertyName("texto")]
    public string Texto { get; set; } = string.Empty;

    [JsonPropertyName("descricao")]
    public string Descricao { get; set; } = string.Empty;

    [JsonPropertyName("ordem")]
    public int Ordem { get; set; }
}
