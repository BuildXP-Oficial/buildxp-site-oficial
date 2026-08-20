using System.Text.Json;
using BuildXP.API.Models;

namespace BuildXP.API.Repositories;

public sealed class UsuarioProgressoRepository : IUsuarioProgressoRepository, IDisposable
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = true,
    };

    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly ILogger<UsuarioProgressoRepository> _logger;
    private readonly string _arquivo;
    private UsuarioProgresso _cache = NovoProgresso();
    private bool _carregado;
    private bool _disposed;

    public UsuarioProgressoRepository(IWebHostEnvironment env, ILogger<UsuarioProgressoRepository> logger)
    {
        _logger = logger;
        var pasta = Path.Combine(env.ContentRootPath, "App_Data");
        Directory.CreateDirectory(pasta);
        _arquivo = Path.Combine(pasta, "usuario-progresso.json");
    }

    public async Task<UsuarioProgresso> ObterAsync()
    {
        await _gate.WaitAsync();
        try
        {
            await GarantirCarregadoUnsafeAsync();
            return Clonar(_cache);
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task SalvarAsync(UsuarioProgresso progresso)
    {
        ArgumentNullException.ThrowIfNull(progresso);

        await _gate.WaitAsync();
        try
        {
            await GarantirCarregadoUnsafeAsync();
            _cache = Normalizar(progresso);
            await PersistirUnsafeAsync();
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<UsuarioProgresso> AtualizarAsync(Func<UsuarioProgresso, UsuarioProgresso> atualizar)
    {
        ArgumentNullException.ThrowIfNull(atualizar);

        await _gate.WaitAsync();
        try
        {
            await GarantirCarregadoUnsafeAsync();
            var proximo = atualizar(Clonar(_cache));
            ArgumentNullException.ThrowIfNull(proximo);
            _cache = Normalizar(proximo);
            await PersistirUnsafeAsync();
            return Clonar(_cache);
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task GarantirCarregadoUnsafeAsync()
    {
        if (_carregado)
            return;

        if (!File.Exists(_arquivo))
        {
            _cache = NovoProgresso();
            _carregado = true;
            await PersistirUnsafeAsync();
            return;
        }

        try
        {
            await using var stream = new FileStream(
                _arquivo,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                bufferSize: 4096,
                useAsync: true);
            var lido = await JsonSerializer.DeserializeAsync<UsuarioProgresso>(stream, JsonOpts);
            _cache = Normalizar(lido ?? NovoProgresso());
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao ler {Arquivo}. Iniciando progresso padrão.", _arquivo);
            _cache = NovoProgresso();
        }

        _carregado = true;
    }

    private async Task PersistirUnsafeAsync()
    {
        var temp = _arquivo + ".tmp";
        try
        {
            await using (var stream = new FileStream(
                temp,
                FileMode.Create,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 4096,
                useAsync: true))
            {
                await JsonSerializer.SerializeAsync(stream, _cache, JsonOpts);
            }

            File.Move(temp, _arquivo, overwrite: true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao persistir progresso em {Arquivo}.", _arquivo);
            throw;
        }
        finally
        {
            if (File.Exists(temp))
            {
                try { File.Delete(temp); }
                catch { /* ignore */ }
            }
        }
    }

    private static UsuarioProgresso NovoProgresso() => new()
    {
        Id = 1,
        XpTotal = 0,
        NivelAtual = 1,
        DesafiosCompletados = 0,
    };

    private static UsuarioProgresso Normalizar(UsuarioProgresso origem) => new()
    {
        Id = origem.Id > 0 ? origem.Id : 1,
        XpTotal = Math.Max(0, origem.XpTotal),
        NivelAtual = Math.Max(1, origem.NivelAtual),
        DesafiosCompletados = Math.Max(0, origem.DesafiosCompletados),
    };

    private static UsuarioProgresso Clonar(UsuarioProgresso origem) => Normalizar(origem);

    public void Dispose()
    {
        if (_disposed) return;
        _gate.Dispose();
        _disposed = true;
        GC.SuppressFinalize(this);
    }
}
