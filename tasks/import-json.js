// Import /breweries.json into /data

import {
  readFile, existsSync, mkdirSync, writeFileSync, readFileSync,
} from 'fs';
import jsonFormat from 'json-format';
import slugify from 'slugify';
import { join } from 'path';
import STATES from './utils/states';

const importFilePath = join(__dirname, '../breweries.json');
const storePath = join(__dirname, '../data/us');
const slugifyOptions = { remove: /[*+~.,()'"!:@]/g };

readFile(importFilePath, { encoding: 'utf-8' }, (err, data) => {
  if (!err) {
    const breweries = JSON.parse(data);
    let errors = 0;

    // Create parent country directory
    if (!existsSync(storePath)) {
      mkdirSync(storePath);
    }

    breweries.forEach((brewery) => {
      const state = STATES[brewery.state];

      // Log error if state is empty
      if (state === undefined) {
        console.log(`👎 ${brewery.name} (${brewery.id}) doesn't have a state.`);
        errors += 1;
        return;
      }

      // Create empty folder for brewery state, if it doesn't exist
      const statePath = `${storePath}/${state.slug}`;
      if (!existsSync(statePath)) {
        mkdirSync(statePath);
      }

      // Create brewery city file with empty array, if it doesn't exist
      const citySlug = slugify(brewery.city.toLowerCase(), slugifyOptions);
      const cityFilePath = `${statePath}/${citySlug}.json`;
      if (!existsSync(cityFilePath)) {
        writeFileSync(cityFilePath, '[]');
      }

      // Read file into variable
      const cityBreweries = JSON.parse(readFileSync(cityFilePath));

      // Add tags property
      // TODO: This should be an optional parameter
      const updatedBrewery = brewery;
      updatedBrewery.tags = [];

      // Remove updated_at and id since this will be automated
      delete updatedBrewery.updated_at;
      delete updatedBrewery.id;

      // Append current brewery
      cityBreweries.push(updatedBrewery);

      // Ovewrite file
      const jsonFormatConfig = {
        type: 'space',
        size: 2,
      };
      writeFileSync(cityFilePath, jsonFormat(cityBreweries, jsonFormatConfig));
    });
    console.log(`☹️ # of Errors: ${errors}`);
  } else {
    console.error(err);
  }
});
