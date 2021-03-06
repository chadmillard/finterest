var vow = require('vow');
var amortize = require('amortize');
var prompt = require('prompt');
var chalk = require('chalk');
var numeral = require('numeral');
var Quandl = require("quandl");
var quandl = new Quandl();

console.log('Getting Current Interest Rates ...');

function getRates(term){
  var deferred = vow.defer();

  quandl.dataset({ source: "FMAC", table: term }, function(err, response){
      if(err)
          throw err;
      deferred.resolve(JSON.parse(response));
  });
  return deferred.promise();
}

var response30, response15;

getRates("FIX30YR")
.then(function(response){
  response30 = response.dataset.data[0];
  return getRates("FIX15YR");
})
.then(function(response){
  response15 = response.dataset.data[0];
})
.then(function(){
  console.log(
  `
  ${chalk.bold('Freddie Mac 30 Year Rate as of '+response30[0]+' '+response30[1]+'%')}
  ${chalk.bold('Freddie Mac 15 Year Rate as of '+response15[0]+' '+response15[1]+'%')}
  `);

  prompt.start();

  var prompts = [
    { name: 'amount', default: 200000}
    ,{ name: 'rate30yr', default: response30[1]}
    ,{ name: 'rate15yr', default: response15[1]}
    ,{ name: 'principalPayment', default: 200}
  ];

  prompt.get(prompts, function (err, result) {
      var amz30p = amortize({
        amount: result.amount,
        rate: result.rate30yr,
        totalTerm: 360,
        amortizeTerm: 360,
        principalPayment: result.principalPayment
      });

      var amz30 = amortize({
        amount: result.amount,
        rate: result.rate30yr,
        totalTerm: 360,
        amortizeTerm: 360
      });

      var amz15p = amortize({
        amount: result.amount,
        rate: result.rate15yr,
        totalTerm: 180,
        amortizeTerm: 180,
        principalPayment: result.principalPayment
      });

      var amz15 = amortize({
        amount: result.amount,
        rate: result.rate15yr,
        totalTerm: 180,
        amortizeTerm: 180
      });

  // 30 year details
  console.log(
  `
  ${chalk.bold('30 Year')}
  ${chalk.yellow('Total Paid: $ '+numeral(amz30.principal+amz30.interest).format())}
  ${chalk.cyan('Monthly Payment: $ '+numeral(amz30.payment).format())}
  ${chalk.red('Interest Paid: $ '+numeral(amz30.interest).format())}

  ${chalk.bold('30 Year with an extra monthly principal payment')}
  ${chalk.yellow('Total Paid: $ '+numeral(amz30p.principal+amz30p.interest).format())}
  ${chalk.cyan('Monthly Payment: $ '+numeral(amz30p.payment).format())}
  ${chalk.red('Interest Paid: $ '+numeral(amz30p.interest).format())}
  ${chalk.red('Extra Principal Paid: $ '+numeral(amz30p.principalPaymentsTotal).format())}
  ${chalk.green('Interest Saved: $ '+numeral(amz30.interest-amz30p.interest).format())}
  ${chalk.green('Years Saved: '+numeral((amz30p.termsSaved/12).toFixed(2)).format('0.00'))}
  `);

  // 15 year details
  console.log(
  `
  ${chalk.bold('15 Year')}
  ${chalk.yellow('Total Paid: $ '+numeral(amz15.principal+amz15.interest).format())}
  ${chalk.cyan('Monthly Payment: $ '+numeral(amz15.payment).format())}
  ${chalk.red('Interest Paid: $ '+numeral(amz15.interest).format())}

  ${chalk.bold('15 Year with an extra monthly principal payment')}
  ${chalk.yellow('Total Paid: $ '+numeral(amz15p.principal+amz15p.interest).format())}
  ${chalk.cyan('Monthly Payment: $ '+numeral(amz15p.payment).format())}
  ${chalk.red('Interest Paid: $ '+numeral(amz15p.interest).format())}
  ${chalk.red('Extra Principal Paid: $ '+numeral(amz15p.principalPaymentsTotal).format())}
  ${chalk.green('Interest Saved: $ '+numeral(amz15.interest-amz15p.interest).format())}
  ${chalk.green('Years Saved: '+numeral((amz15p.termsSaved/12).toFixed(2)).format('0.00'))}
  `);

  // Diff
  console.log(
  `
  ${chalk.bold('15 Year vs 30 Year')}
  ${chalk.green('Interest Saved: $ '+numeral(amz30.interest-amz15.interest).format())}
  `);

  });
});
