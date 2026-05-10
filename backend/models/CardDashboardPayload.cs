using System.Text.Json.Serialization;

namespace BuildXP.API.Models;

/// <summary>Corpo JSON do dashboard (snake_case) para criar/atualizar cards.</summary>
public class CardDashboardPayload
{
    [JsonPropertyName("slug")]
    public string? Slug { get; set; }

    [JsonPropertyName("theme")]
    public string? Theme { get; set; }

    /// <summary>Cor de destaque (#rgb ou #rrggbb). Se inválida ou omitida, deriva do tema preset.</summary>
    [JsonPropertyName("border_color")]
    public string? BorderColor { get; set; }

    [JsonPropertyName("rarity_label")]
    public string? RarityLabel { get; set; }

    [JsonPropertyName("card_class")]
    public string? CardClass { get; set; }

    [JsonPropertyName("display_name")]
    public string? DisplayName { get; set; }

    [JsonPropertyName("description_html")]
    public string? DescriptionHtml { get; set; }

    [JsonPropertyName("link_beginner")]
    public string? LinkBeginner { get; set; }

    [JsonPropertyName("link_ref")]
    public string? LinkRef { get; set; }

    [JsonPropertyName("xp_current")]
    public int? XpCurrent { get; set; }

    [JsonPropertyName("xp_max")]
    public int? XpMax { get; set; }

    [JsonPropertyName("sort_order")]
    public int? SortOrder { get; set; }

    [JsonPropertyName("btn_primary_label")]
    public string? BtnPrimaryLabel { get; set; }

    [JsonPropertyName("btn_secondary_label")]
    public string? BtnSecondaryLabel { get; set; }

    [JsonPropertyName("icon_layout")]
    public string? IconLayout { get; set; }

    [JsonPropertyName("icon_primary_src")]
    public string? IconPrimarySrc { get; set; }

    [JsonPropertyName("icon_primary_alt")]
    public string? IconPrimaryAlt { get; set; }

    [JsonPropertyName("icon_secondary_src")]
    public string? IconSecondarySrc { get; set; }

    [JsonPropertyName("icon_secondary_alt")]
    public string? IconSecondaryAlt { get; set; }

    [JsonPropertyName("is_published")]
    public bool? IsPublished { get; set; }
}
