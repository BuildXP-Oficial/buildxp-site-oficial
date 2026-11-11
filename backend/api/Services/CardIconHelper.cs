using System.Text.RegularExpressions;
using BuildXP.API.Models;

namespace BuildXP.API.Services;

public static class CardIconHelper
{
    public const string DbPrimaryMarker = "db:primary";
    public const string DbSecondaryMarker = "db:secondary";
    public const string TempPrefix = "icon-temp:";

    private static readonly string[] AllowedMime =
    [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        "image/svg+xml",
    ];

    public static bool IsAllowedMime(string? mime) =>
        !string.IsNullOrWhiteSpace(mime) &&
        AllowedMime.Contains(mime.Trim().ToLowerInvariant());

    public static string MimeFromExtension(string ext) =>
        ext.Trim().ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            ".svg" => "image/svg+xml",
            _ => "image/png",
        };

    public static bool HasPrimaryBytes(SkillCard c) => c.IconPrimaryBytes is { Length: > 0 };

    public static bool HasSecondaryBytes(SkillCard c) => c.IconSecondaryBytes is { Length: > 0 };

    public static bool IsTempRef(string? src) =>
        !string.IsNullOrWhiteSpace(src) &&
        src.Trim().StartsWith(TempPrefix, StringComparison.OrdinalIgnoreCase);

    public static Guid? ParseTempId(string? src)
    {
        if (!IsTempRef(src)) return null;
        var id = src!.Trim()[TempPrefix.Length..];
        return Guid.TryParse(id, out var g) ? g : null;
    }

    public static string TempRef(Guid id) => $"{TempPrefix}{id:D}";

    public static string PublicPrimaryUrl(int cardId) => $"/api/card/{cardId}/icon/primary";

    public static string PublicSecondaryUrl(int cardId) => $"/api/card/{cardId}/icon/secondary";

    public static string PublicTempUrl(Guid id) => $"/api/card/icon-upload/{id:D}";

    /// <summary>URL para &lt;img src&gt; — BD, upload pendente ou ficheiro estático legado.</summary>
    public static string ResolvePrimaryPublicSrc(SkillCard c)
    {
        if (HasPrimaryBytes(c)) return PublicPrimaryUrl(c.Id);
        var src = (c.IconPrimarySrc ?? "").Trim();
        if (IsTempRef(src))
        {
            var g = ParseTempId(src);
            if (g.HasValue) return PublicTempUrl(g.Value);
        }
        if (!string.IsNullOrEmpty(src) &&
            !src.Equals(DbPrimaryMarker, StringComparison.OrdinalIgnoreCase))
            return src;
        return "imagens/logo2buildxpret.png";
    }

    public static string ResolveSecondaryPublicSrc(SkillCard c)
    {
        if (HasSecondaryBytes(c)) return PublicSecondaryUrl(c.Id);
        var src = (c.IconSecondarySrc ?? "").Trim();
        if (IsTempRef(src))
        {
            var g = ParseTempId(src);
            if (g.HasValue) return PublicTempUrl(g.Value);
        }
        if (!string.IsNullOrEmpty(src) &&
            !src.Equals(DbSecondaryMarker, StringComparison.OrdinalIgnoreCase))
            return src;
        return string.Empty;
    }

    /// <summary>Valor a guardar em IconPrimarySrc após persistir bytes na BD.</summary>
    public static string MarkerAfterBytesStored(bool primary) =>
        primary ? DbPrimaryMarker : DbSecondaryMarker;

    public static bool IsDuplicateUploadFileName(string fileName)
    {
        var name = Path.GetFileName(fileName);
        return Regex.IsMatch(
            name,
            @"^(.+?)_[0-9a-f]{32}\.(png|jpe?g|webp|gif|svg)$",
            RegexOptions.IgnoreCase);
    }

    /// <summary>Valor para o formulário do dashboard (não URL pública).</summary>
    public static string ResolvePrimaryStorageRef(SkillCard c)
    {
        if (HasPrimaryBytes(c)) return DbPrimaryMarker;
        var src = (c.IconPrimarySrc ?? "").Trim();
        if (string.IsNullOrEmpty(src) && !string.IsNullOrWhiteSpace(c.Icone))
            src = c.Icone.Trim();
        if (IsTempRef(src) || src.Equals(DbPrimaryMarker, StringComparison.OrdinalIgnoreCase))
            return src;
        return MapDuplicateToOriginalPath(src) ?? src;
    }

    public static string ResolveSecondaryStorageRef(SkillCard c)
    {
        if (HasSecondaryBytes(c)) return DbSecondaryMarker;
        var src = (c.IconSecondarySrc ?? "").Trim();
        if (IsTempRef(src) || src.Equals(DbSecondaryMarker, StringComparison.OrdinalIgnoreCase))
            return src;
        if (string.IsNullOrEmpty(src)) return string.Empty;
        return MapDuplicateToOriginalPath(src) ?? src;
    }

    public static string? MapDuplicateToOriginalPath(string storedPath)
    {
        if (string.IsNullOrWhiteSpace(storedPath)) return null;
        var t = storedPath.Trim().Replace('\\', '/');
        if (!t.StartsWith("imagens/", StringComparison.OrdinalIgnoreCase)) return null;
        var file = Path.GetFileName(t);
        var m = Regex.Match(
            file,
            @"^(.+?)_[0-9a-f]{32}\.(png|jpe?g|webp|gif|svg)$",
            RegexOptions.IgnoreCase);
        if (!m.Success) return null;
        return $"imagens/{m.Groups[1].Value}.{m.Groups[2].Value}".ToLowerInvariant();
    }
}
