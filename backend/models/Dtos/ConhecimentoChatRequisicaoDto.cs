namespace BuildXP.API.Models.Dtos;

public class ConhecimentoChatMensagemDto
{
    public string Papel { get; set; } = "user";

    public string Conteudo { get; set; } = string.Empty;
}

public class ConhecimentoChatRequisicaoDto
{
    public string MensagemUsuario { get; set; } = string.Empty;

    public string TemaOuCardAtual { get; set; } = string.Empty;

    public string ConteudoCard { get; set; } = string.Empty;

    public List<ConhecimentoChatMensagemDto> Historico { get; set; } = [];
}
