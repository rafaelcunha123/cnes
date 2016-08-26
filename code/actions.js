const r = require('ramda')
var async = require('async');
var request = require('request-promise');
var cheerio = require("cheerio");
const Promise = require('bluebird')

var Converter = require("csvtojson").Converter;
var converter = new Converter({
	delimiter: ';'
});

function lineToJSON(line) {
  const header = [
    'cnes', 'estabelecimento', 'municipio', 'cnpj', 'cnpjMnatenedora',
  ]
  const arr = line.split(';')
  return r.zipObj(header, arr)
}

function getClinicsData(clinic) {
  return Promise.all([
    requestClinicRegister(clinic),
    requestClinicLocation(clinic),
    requestClinicProfessionals(clinic),
  ])
    .then(([register, location, professionals]) => {
      writeToMongo(r.merge(clinic, {
        clinicRegister: register,
        clinicLocation: location,
        clinicProfessionals: professionals,
      }))
    })
}

var requestClinicRegister = function({ cnes, municipioIbge }) {
  return request({
    uri: "http://cnes2.datasus.gov.br/Exibe_Ficha_Estabelecimento.asp?VCo_Unidade=" + municipioIbge + cnes,
  })
    .then(body => {
      var $ = cheerio.load(body);
      return validateClinicDom($)
        .then(buildClinicObject)
    })
    .catch(err => { throw new Error('Could not get clinic register') })
}

var requestClinicLocation = function({ cnes, municipioIbge }) {
  return request({
			uri: "http://cnes2.datasus.gov.br/geo.asp?VUnidade=" + municipioIbge + cnes,
      json: true,
  })
    .then(body => {
				var $ = cheerio.load(body);
				return {
					lat: $('[name="latitude"]').attr('value'),
					lon: $('[name="longitude"]').attr('value')
				}
    })
}

var requestClinicProfessionals = function({ cnes, municipioIbge }) {
  return request({
    uri: "http://cnes2.datasus.gov.br/Mod_Profissional.asp?VCo_Unidade=" + municipioIbge + cnes,
    json: true,
  })
    .then(body => {
      var $ = cheerio.load(body);
      return validateClinicDom($)
        .then(buildProfessionalsObject)
    })
}

var writeToMongo = function(clinic) {
	if (!clinic.clinicRegister.cnes || clinic.clinicRegister.cnes.length == 0 || clinic.clinicRegister.cnes.length > 7) {
		console.log('Fetch Error')
	} else {
		collection.insertOne(clinic);
	}
}

var validateClinicDom = function($) {
	return new Promise(function(resolve, reject) {
		if ($('p')) {
			$('p').each(function() {
				if ($(this).text().indexOf("Estabelecimento n") > 0) {
					throw new Error('CNES website did not find entity!')
				};
			});
			resolve($);
		} else {
			resolve($);
		}
	})
}

var buildClinicObject = function($) {
	return new Promise(function(resolve, reject) {
		var counter = 1,
			responseObject = {
				status: true
			};
		$("table:nth-child(2) td").each(function() {
			var data = $(this).text().trim();
			switch (counter) {
				case 12:
					responseObject.nome = data;
					break;
				case 13:
					responseObject.cnes = data;
					break;
				case 14:
					responseObject.cnpj = data;
					break;
				case 18:
					responseObject.nomeEmpresarial = data;
					break;
				case 19:
					responseObject.cpf = data;
					break;
				case 20:
					responseObject.personalidade = data;
					break;
				case 24:
					responseObject.logradouro = data;
					break;
				case 25:
					responseObject.numero = data;
					break;
				case 26:
					responseObject.telefone = data;
					break;
				case 32:
					responseObject.complemento = data;
					break;
				case 33:
					responseObject.bairro = data;
					break;
				case 34:
					responseObject.cep = data;
					break;
				case 35:
					responseObject.municipio = data;
					break;
				case 36:
					responseObject.uf = data;
					break;
				case 41:
					responseObject.tipoEstabelecimento = data;
					break;
				case 42:
					responseObject.subtipoEstabelecimento = data;
					break;
				case 43:
					responseObject.gestao = data;
					break;
				case 44:
					responseObject.dependencia = data;
					break;
				case 48:
					responseObject.numeroAlvara = data;
					break;
				case 49:
					responseObject.orgaoExpedidor = data;
					break;
				case 50:
					responseObject.dataExpedicao = data;
					break;
				case 52:
					responseObject.horarioFuncionamento = data;
					break;
			}
			counter++
		});
		resolve(responseObject);
	});
}

var buildProfessionalsObject = function($) {
	return new Promise(function(resolve, reject) {
		var counter = 1,
			professional = 1,
			responseObject = {};
		responseObject[professional] = {};

		$('#demo table tbody td').each(function() {
			var data = $(this).text();
			if(counter ===18){
				counter = 1;
				professional++;
				responseObject[professional] = {};
			}
			switch (counter) {
				case 1:
					responseObject[professional].nome = data.split('\n')[1].trim();
					break;
				case 2:
					responseObject[professional].dataDeEntrada = data.trim();
					break;
				case 3:
					responseObject[professional].cns = data.trim();
					break;
				case 4:
					responseObject[professional].cnsMaster = data.trim();
					break;
				case 5:
					responseObject[professional].dataDeAtribuicao = data.trim();
					break;
				case 6:
					responseObject[professional].CBO = data.trim();
					break;
				case 7:
					responseObject[professional].chOutros = data.trim();
					break;
				case 8:
					responseObject[professional].chAmb = data.trim();
					break;
				case 9:
					responseObject[professional].chHosp = data.trim();
					break;
				case 10:
					responseObject[professional].chTotal = data.trim();
					break;
				case 11:
					responseObject[professional].sus = data.trim();
					break;
				case 12:
					responseObject[professional].vinculacao = data.trim();
					break;
				case 13:
					responseObject[professional].tipo = data.trim();
					break;
				case 14:
					responseObject[professional].subTipo = data.trim();
					break;
				case 15:
					responseObject[professional].compDesativacao = data.trim();
					break;
				case 16:
					responseObject[professional].situacao = data.trim();
					break;
				case 17:
					responseObject[professional].portaria134 = data.trim();
					break;
			}
			counter++
		});
		resolve(responseObject);
	})
}


module.exports = {
  lineToJSON,
	getClinicsData,
}
