import { run, intervalsToTimeSeries } from './run'
import { readFileSync, writeFileSync } from 'fs'
import { AllParamsFlat } from './types/Param.types'
import severityData from '../assets/data/severityData.json'
import { SeverityTableRow } from '../components/Main/Scenario/ScenarioTypes'
import { getCountryAgeDistribution } from '../components/Main/state/countryAgeDistributionData'
import { Scenario } from '../.generated/types'

const handleRejection: NodeJS.UnhandledRejectionListener = err => {
  throw err
}

process.on('unhandledRejection', handleRejection);

enum Args {
  // 0 is node, 1 is this script
  Params = 2
  // Severity,
  // CountryAgeDistribution,
}

function readJsonFromFile<T>(args: Args) {
  const inputFilename = process.argv[args]
  if (!inputFilename) {
    usage();
  }
  console.log(`Reading ${Args[args]} from file ${inputFilename}`);
  const inputData = readFileSync(inputFilename, 'utf8')
  const inputJson = JSON.parse(inputData) as T
  if(inputJson === undefined) {
    throw new Error(`Failed to parse ${inputFilename}`);
  }
  // console.log(inputJson);
  return inputJson
}

async function main() {
  const scenario = readJsonFromFile<Scenario>(Args.Params);
  const outputFile = process.argv[3];
  if (!outputFile) {
    usage();
  }
  console.log(`Writing output to ${outputFile}`);

  const allParams = scenario.allParams;
  const params: AllParamsFlat = {
    ...allParams.population,
    ...allParams.epidemiological,
    ...allParams.simulation,
    ...allParams.containment,
  }
  // This reads directly from severityData.json.
  const severity = severityData as SeverityTableRow[];
  // This reads directly from country_age_distribution.json and validates the JSON.
  const ageDistribution = getCountryAgeDistribution(allParams.population.country);
  // This reads containment info from the scenario.
  const containment = intervalsToTimeSeries(allParams.containment.mitigationIntervals);
  const result = await run(params, severity, ageDistribution, containment);
  console.log('Run complete');
  console.log(result);
  writeFileSync(outputFile, JSON.stringify(result))
}

function usage() {
  console.log(
    `
Usage:

    cli <input-file> <output-file>

        Manually perform a single model run with the given input. Print the output to stdout.

    `.trim()
  )

  process.exit(1)
}

main()
