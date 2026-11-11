namespace BuildXP.API.Models;

public class RecuperacaoSenha
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public DateTime ExpiraEm { get; set; } = DateTime.UtcNow;
    public bool Usado { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
