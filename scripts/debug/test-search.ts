import { searchAllData } from '../../src/lib/search/actions';

async function test() {
  const res = await searchAllData('a');
  console.log(JSON.stringify(res, null, 2));
}

test();
