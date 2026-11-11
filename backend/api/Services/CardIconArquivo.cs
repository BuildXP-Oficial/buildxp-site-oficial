using System.Text.RegularExpressions;

namespace BuildXP.API.Services;

internal static class CardIconArquivo
{
    internal static async Task<string> SalvarEmWwwrootAsync(
        byte[] data,
        string originalFileName,
        string webRootPath,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(webRootPath))
            throw new InvalidOperationException("WebRoot não configurado.");
        if (data is not { Length: > 0 })
            throw new InvalidOperationException("Ficheiro vazio.");

        var ext = Path.GetExtension(originalFileName).ToLowerInvariant();
        var baseName = Path.GetFileNameWithoutExtension(originalFileName);
        baseName = Regex.Replace(baseName ?? "", @"[^a-zA-Z0-9_-]", "_");
        if (string.IsNullOrWhiteSpace(baseName)) baseName = "icon";
        if (baseName.Length > 48) baseName = baseName[..48];

        var fileName = $"{baseName}{ext}".ToLowerInvariant();
        var imagensDir = Path.Combine(webRootPath, "imagens");
        Directory.CreateDirectory(imagensDir);
        var physical = Path.Combine(imagensDir, fileName);

        await using (var stream = new FileStream(
                         physical,
                         FileMode.Create,
                         FileAccess.Write,
                         FileShare.None,
                         bufferSize: 65536,
                         options: FileOptions.Asynchronous))
        {
            await stream.WriteAsync(data, ct);
        }

        return $"imagens/{fileName}".Replace('\\', '/');
    }
}
