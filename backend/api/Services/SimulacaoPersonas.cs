namespace BuildXP.API.Services;

public static class SimulacaoPersonas
{
    public static string Normalizar(string? bruto)
    {
        var p = (bruto ?? string.Empty).Trim().ToLowerInvariant();
        p = p.Replace(' ', '_');
        p = p.Replace("í", "i").Replace("é", "e").Replace("á", "a").Replace("ã", "a").Replace("ó", "o");

        return p switch
        {
            "rh_cultura" or "rh" or "cultura" or "recrutador_rh" => "rh_cultura",
            "tech_lead_gerente" or "tech_lead" or "gerente" or "recrutador_tecnico_rigoroso" or "recrutador_tecnico" or "gestor_dificil" or "gestor" => "tech_lead_gerente",
            "stakeholder_negocios" or "stakeholder" or "negocios" or "cliente_exigente" or "cliente" => "stakeholder_negocios",
            _ => string.IsNullOrWhiteSpace(p) ? "rh_cultura" : p,
        };
    }
}
