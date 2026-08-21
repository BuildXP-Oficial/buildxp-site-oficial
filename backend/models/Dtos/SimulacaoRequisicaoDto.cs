namespace BuildXP.API.Models.Dtos;

public class MensagemHistoricoDto
{
    /// <summary>usuario ou persona.</summary>
    public string Remetente { get; set; } = string.Empty;

    public string Texto { get; set; } = string.Empty;
}

public class SimulacaoRequisicaoDto
{
    /// <summary>
    /// Ex.: rh_cultura, tech_lead_gerente, stakeholder_negocios.
    /// </summary>
    public string Persona { get; set; } = string.Empty;

    public string Cenario { get; set; } = string.Empty;

    public List<MensagemHistoricoDto> HistoricoMensagens { get; set; } = [];

    public string MensagemUsuario { get; set; } = string.Empty;
}
