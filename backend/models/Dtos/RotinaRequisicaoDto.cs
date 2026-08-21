namespace BuildXP.API.Models.Dtos;

public class RotinaRequisicaoDto
{
    public List<TarefaDto> TarefasAtuais { get; set; } = [];

    /// <summary>alta, media ou baixa.</summary>
    public string NivelEnergia { get; set; } = string.Empty;

    public int HorasDisponiveis { get; set; }
}
