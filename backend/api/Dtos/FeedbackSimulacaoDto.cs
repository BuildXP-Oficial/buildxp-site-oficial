namespace BuildXP.API.Models.Dtos;

public class FeedbackSimulacaoDto
{
    /// <summary>Texto do relatório final da simulação.</summary>
    public string Relatorio { get; set; } = string.Empty;

    /// <summary>Nota geral de 0 a 10.</summary>
    public int Nota { get; set; }

    public List<string> PontosFortes { get; set; } = [];

    public List<string> PontosMelhoria { get; set; } = [];
}
