using System.Text.Json.Serialization;

namespace BuildXP.API.Models;

/// <summary>Substitui todos os slides de um card (evita duplicar ao editar).</summary>
public class SlidesSyncPayload
{
    [JsonPropertyName("slides")]
    public List<SlideSyncItem> Slides { get; set; } = [];
}

public class SlideSyncItem
{
    [JsonPropertyName("ordem")]
    public int Ordem { get; set; }

    [JsonPropertyName("titulo")]
    public string Titulo { get; set; } = string.Empty;

    [JsonPropertyName("descricao")]
    public string Descricao { get; set; } = string.Empty;
}
