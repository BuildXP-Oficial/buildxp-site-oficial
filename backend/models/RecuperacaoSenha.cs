namespace BuildXP.API.Models; // Nome do Arquivo: RecuperacaoSenha.cs

public class RecuperacaoSenha // Armazena o código de recuperação de senha
{
    public int Id { get; set; } = 0;
    public string Email { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public DateTime ExpiraEm { get; set; } = DateTime.UtcNow;
    public bool Usado { get; set; } = false;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}

