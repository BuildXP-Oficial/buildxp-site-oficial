namespace BuildXP.API.Models;

/// <summary>Ícone enviado antes de gravar o card; referência <c>icon-temp:{Id}</c>.</summary>
public class CardIconUpload
{
    public Guid Id { get; set; }
    public byte[] Data { get; set; } = [];
    public string MimeType { get; set; } = "image/png";
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
