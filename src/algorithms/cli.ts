import { run, intervalsToTimeSeries } from './run'
import { readFileSync } from 'fs'
import { AllParamsFlat, AllParams } from './types/Param.types'
import severityData from '../assets/data/severityData.json'
import { SeverityTableRow } from '../components/Main/Scenario/SeverityTable'
import { TimeSeries } from './types/TimeSeries.types'
import { getScenarioData } from '../components/Main/state/scenarioData'
import { getCountryAgeDistribution } from '../components/Main/state/countryAgeDistributionData'

const handleRejection: NodeJS.UnhandledRejectionListener = err => {
  throw err
}

process.on('unhandledRejection', handleRejection);

enum Args {
  // 0 is node, 1 is this script
  // Params,
  // Severity,
  // CountryAgeDistribution,
  Containment = 2
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
  const region = process.argv[2];
  if (!region) {
    usage();
  }
  console.log(`Running model for region ${region}`);
  
  // This reads directly from scenarios.json and validates the JSON.
  let params: AllParams;
  try {
    params = getScenarioData(region);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
  const paramsFlat: AllParamsFlat = {
    ...params.population,
    ...params.epidemiological,
    ...params.simulation,
    ...params.containment,
  }
  // This reads directly from severityData.json.
  const severity = severityData as SeverityTableRow[];
  // This reads directly from country_age_distribution.json and validates the JSON.
  const ageDistribution = getCountryAgeDistribution(region);
  // This reads containment info from the scenario.
  // TODO make this customisable, the user will expect to change the values.
  const containment = intervalsToTimeSeries(params.containment.mitigationIntervals);
  const result = await run(paramsFlat, severity, ageDistribution, containment);
  console.log('Run complete');
  console.log(result);
}

function usage() {
  console.log(
    `
Usage:

    cli <country>

        Manually perform a single model run with the given input. Print the output to stdout.

    `.trim()
  )

  process.exit(1)
}

main()
