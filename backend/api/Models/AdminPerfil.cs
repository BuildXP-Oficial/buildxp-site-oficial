namespace BuildXP.API.Models;

/// <summary>
/// Perfil persistido do administrador (foto, email, username e senha).
/// Mantém compatibilidade com o admin antigo baseado em appsettings: se a tabela não existir, a API volta ao fallback.
/// </summary>
public class AdminPerfil
{
    public int Id { get; set; }

    public string Usuario { get; set; } = "admin";

    public string? Email { get; set; }

    /// <summary>Senha em texto simples (mantido por compatibilidade com o resto do projeto).</summary>
    public string Senha { get; set; } = string.Empty;

    public byte[]? FotoBytes { get; set; }

    public string? FotoMimeType { get; set; }

    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
}

