namespace BuildXP.API.Models;

public class FaixaColaborador
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Icone { get; set; } = "github";
    public string Link { get; set; } = string.Empty;
    public int Ordem { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
