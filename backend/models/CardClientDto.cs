using System.Text.Json.Serialization;

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

    public static CardClientDto FromEntity(SkillCard c) => new()
    {
        Id = c.Id,
        Slug = c.Slug,
        Theme = c.Theme,
        DisplayName = c.Titulo,
        RarityLabel = c.Raridade,
        CardClass = c.Classe,
        DescriptionHtml = c.Descricao,
        LinkBeginner = c.LinkBeginner,
        LinkRef = c.LinkRef,
        XpCurrent = c.XpAtual,
        XpMax = c.XpMaximo,
        SortOrder = c.Ordem,
        BtnPrimaryLabel = c.BtnPrimaryLabel,
        BtnSecondaryLabel = c.BtnSecondaryLabel,
        IconLayout = string.IsNullOrEmpty(c.IconLayout) ? "single" : c.IconLayout,
        IconPrimarySrc = string.IsNullOrEmpty(c.IconPrimarySrc) ? c.Icone : c.IconPrimarySrc,
        IconPrimaryAlt = c.IconPrimaryAlt,
        IconSecondarySrc = string.IsNullOrEmpty(c.IconSecondarySrc) ? null : c.IconSecondarySrc,
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
            })
            .ToList(),
    };
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
}
