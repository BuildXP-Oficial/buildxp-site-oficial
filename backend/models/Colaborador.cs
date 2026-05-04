namespace BuildXP.API.Models;

public class Colaborador
{
    public int Id { get; set; } = 0;
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;      // hash da senha
    public string? TokenConvite { get; set; }              // token do link de convite
    public DateTime? TokenExpiraEm { get; set; }           // quando o token expira
    public bool Ativo { get; set; } = false;               // só ativo após criar senha
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}