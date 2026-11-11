using System.ComponentModel.DataAnnotations;

namespace BuildXP.API.Models.Dtos;

public class TarefaDto
{
    [MaxLength(80)]
    public string Id { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Titulo { get; set; } = string.Empty;

    [Range(0, 480)]
    public int DuracaoMinutos { get; set; }

    /// <summary>Quanto maior, mais urgente (ex.: 1 a 5).</summary>
    [Range(0, 5)]
    public int Urgencia { get; set; }

    public bool Concluida { get; set; }

    /// <summary>Se verdadeiro, o agente pode remarcar a tarefa sozinho.</summary>
    public bool Flexivel { get; set; }
}
