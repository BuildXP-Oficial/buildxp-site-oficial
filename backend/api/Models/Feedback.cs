namespace BuildXP.API.Models;

public class Feedback
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    /// <summary>Categoria do mural (ex.: Ideia, XP positivo, Erro). Não confundir com Categoria dos slides.</summary>
    public string Categoria { get; set; } = string.Empty;
    public string Mensagem { get; set; } = string.Empty;
    public StatusFeedback Status { get; set; } = StatusFeedback.Pendente;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime? AvaliadoEm { get; set; }
    /// <summary>Utilizador do painel que aprovou ou rejeitou (nome do JWT ou campo do moderador).</summary>
    public string? ModeradoPor { get; set; }
}

public enum StatusFeedback
{
    Pendente,
    Aprovado,
    Rejeitado,
}
