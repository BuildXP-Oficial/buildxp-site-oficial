using System.ComponentModel.DataAnnotations;

namespace BuildXP.API.Models.Dtos;

public class ConhecimentoChatMensagemDto
{
    [MaxLength(32)]
    public string Papel { get; set; } = "user";

    [MaxLength(1500)]
    public string Conteudo { get; set; } = string.Empty;
}

public class ConhecimentoChatRequisicaoDto
{
    [MaxLength(1500)]
    public string MensagemUsuario { get; set; } = string.Empty;

    [MaxLength(200)]
    public string TemaOuCardAtual { get; set; } = string.Empty;

    [MaxLength(6000)]
    public string ConteudoCard { get; set; } = string.Empty;

    [Length(0, 16)]
    public List<ConhecimentoChatMensagemDto> Historico { get; set; } = [];
}
