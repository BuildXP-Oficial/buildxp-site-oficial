namespace BuildXP.API.Models.Dtos;

public record LoginRequest(string Usuario, string Senha);

public record RecuperacaoRequest(string Email);

public record ValidarCodigoRecuperacaoRequest(string Email, string Codigo);

public record RedefinicaoRequest(string Email, string Codigo, string NovaSenha);
