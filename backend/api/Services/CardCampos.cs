using System.Text.RegularExpressions;
using BuildXP.API.Models;

namespace BuildXP.API.Services;

internal static class CardCampos
{
    internal static string CorParaTema(string? theme)
    {
        if (string.IsNullOrWhiteSpace(theme)) return "#39d353";
        return theme.Trim().ToLowerInvariant() switch
        {
            "git" => "#39d353",
            "docker" => "#2496ed",
            "npm" => "#cb3837",
            "dotnet" => "#512bd4",
            "api" => "#22d3ee",
            "python" => "#3776ab",
            "ia" => "#3c19e6",
            _ => "#39d353",
        };
    }

    internal static bool TryNormalizeHexColor(string? input, out string normalized)
    {
        normalized = string.Empty;
        if (string.IsNullOrWhiteSpace(input)) return false;
        var s = input.Trim();
        if (s.StartsWith("#", StringComparison.Ordinal))
            s = s[1..];
        if (s.Length == 3 && Regex.IsMatch(s, "^[0-9a-fA-F]{3}$"))
        {
            normalized = $"#{s[0]}{s[0]}{s[1]}{s[1]}{s[2]}{s[2]}".ToLowerInvariant();
            return true;
        }

        if (s.Length == 6 && Regex.IsMatch(s, "^[0-9a-fA-F]{6}$"))
        {
            normalized = "#" + s.ToLowerInvariant();
            return true;
        }

        return false;
    }

    internal static void AplicarLimitesColunasSkillCard(SkillCard card)
    {
        static string Clamp(string? s, int maxLen)
        {
            if (string.IsNullOrEmpty(s)) return string.Empty;
            var t = s.Trim();
            return t.Length <= maxLen ? t : t[..maxLen];
        }

        static string IconSrcParaBd(string? s)
        {
            const int max = 512;
            const string fallback = "imagens/logo2buildxpret.png";
            if (string.IsNullOrWhiteSpace(s)) return string.Empty;
            var t = s.Trim();
            if (t.StartsWith(CardIconHelper.TempPrefix, StringComparison.OrdinalIgnoreCase) ||
                t.Equals(CardIconHelper.DbPrimaryMarker, StringComparison.OrdinalIgnoreCase) ||
                t.Equals(CardIconHelper.DbSecondaryMarker, StringComparison.OrdinalIgnoreCase))
                return t;
            if (t.StartsWith("data:", StringComparison.OrdinalIgnoreCase) && t.Length > max)
                return fallback;
            var mapped = CardIconHelper.MapDuplicateToOriginalPath(t);
            if (mapped is not null) return mapped;
            return t.Length <= max ? t : t[..max];
        }

        const int maxLen = 512;

        card.Slug = Clamp(card.Slug, 48);
        card.Theme = string.IsNullOrWhiteSpace(card.Theme) ? "git" : Clamp(card.Theme, 32);
        card.Titulo = Clamp(card.Titulo, 120);
        card.Raridade = Clamp(card.Raridade, 32);
        card.Classe = Clamp(card.Classe, 60);
        var cb = Clamp(card.CorBorda, 7);
        card.CorBorda = cb.Length == 7 && cb.StartsWith("#", StringComparison.Ordinal) ? cb : "#39d353";
        card.LinkBeginner = Clamp(card.LinkBeginner, maxLen);
        card.LinkRef = Clamp(card.LinkRef, maxLen);
        card.BtnPrimaryLabel = Clamp(card.BtnPrimaryLabel, 80);
        card.BtnSecondaryLabel = Clamp(card.BtnSecondaryLabel, 80);
        card.IconLayout = string.IsNullOrWhiteSpace(card.IconLayout) ? "single" : Clamp(card.IconLayout, 16);
        card.IconPrimarySrc = IconSrcParaBd(card.IconPrimarySrc);
        card.IconSecondarySrc = IconSrcParaBd(card.IconSecondarySrc);
        card.IconPrimaryAlt = Clamp(card.IconPrimaryAlt, 200);
        card.IconSecondaryAlt = Clamp(card.IconSecondaryAlt, 200);
        card.Icone = !string.IsNullOrEmpty(card.IconPrimarySrc)
            ? card.IconPrimarySrc
            : Clamp(card.Icone, maxLen);
    }
}
