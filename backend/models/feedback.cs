namespace BuildXP.API.Models; // Nome do Arquivo: Feedback.cs

public class Feedback // Classe do Modelo de Feedback   
{
    public int Id { get; set; } = 0; // ID do Feedback
    public string Nome { get; set; } = string.Empty; // Nome do Feedback
    public string Mensagem { get; set; } = string.Empty; // Mensagem do Feedback
    public StatusFeedback Status {get; set;} = StatusFeedback.Pendente; // Status começa sempre pendente
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow; // Data de Criação do Feedback - gerada automaticamente 
    public DateTime? AtualizadoEm { get; set; } // Só preenchido quando o feedback é atualizado 
}

public enum StatusFeedback // Enum dos Status do Feedback
{
    Pendente, // Feedback pendente de aprovação
    Aprovado, // Feedback aprovado
    Rejeitado // Feedback rejeitado
}