namespace BuildXP.API.Models;

public class Colaborador
{
    public int Id { get; set; } = 0;
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
    /// <summary>Nome de utilizador para login (opcional até configurar no painel). Único quando preenchido.</summary>
    public string? Usuario { get; set; }
    public string? TokenConvite { get; set; }
    public DateTime? TokenExpiraEm { get; set; }
    public bool Ativo { get; set; } = false;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public string? FotoMimeType { get; set; }
    public byte[]? FotoBytes { get; set; }
}