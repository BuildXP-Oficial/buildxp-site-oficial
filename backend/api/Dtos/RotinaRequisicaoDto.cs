using System.ComponentModel.DataAnnotations;

namespace BuildXP.API.Models.Dtos;

public class RotinaRequisicaoDto
{
    [Length(0, 20)]
    public List<TarefaDto> TarefasAtuais { get; set; } = [];

    /// <summary>alta, media ou baixa.</summary>
    [MaxLength(16)]
    public string NivelEnergia { get; set; } = string.Empty;

    [Range(0, 24)]
    public int HorasDisponiveis { get; set; }
}
