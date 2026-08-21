namespace BuildXP.API.Models.Dtos;

public class RotinaRespostaDto
{
    public List<TarefaDto> TarefasAjustadas { get; set; } = [];

    public string MensagemAgente { get; set; } = string.Empty;
}
