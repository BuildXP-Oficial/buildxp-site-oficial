namespace BuildXP.API.Models.Dtos;

public class TarefaDto
{
    public string Id { get; set; } = string.Empty;

    public string Titulo { get; set; } = string.Empty;

    public int DuracaoMinutos { get; set; }

    /// <summary>Quanto maior, mais urgente (ex.: 1 a 5).</summary>
    public int Urgencia { get; set; }

    public bool Concluida { get; set; }

    /// <summary>Se verdadeiro, o agente pode remarcar a tarefa sozinho.</summary>
    public bool Flexivel { get; set; }
}
