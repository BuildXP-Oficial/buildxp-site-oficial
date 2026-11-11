using System.ComponentModel.DataAnnotations;

namespace BuildXP.API.Models.Dtos;

public class MensagemHistoricoDto
{
    /// <summary>usuario ou persona.</summary>
    [MaxLength(40)]
    public string Remetente { get; set; } = string.Empty;

    [MaxLength(1500)]
    public string Texto { get; set; } = string.Empty;
}

public class SimulacaoRequisicaoDto
{
    /// <summary>
    /// Ex.: rh_cultura, tech_lead_gerente, stakeholder_negocios.
    /// </summary>
    [MaxLength(80)]
    public string Persona { get; set; } = string.Empty;

    [MaxLength(800)]
    public string Cenario { get; set; } = string.Empty;

    [Length(0, 32)]
    public List<MensagemHistoricoDto> HistoricoMensagens { get; set; } = [];

    [MaxLength(1500)]
    public string MensagemUsuario { get; set; } = string.Empty;
}
