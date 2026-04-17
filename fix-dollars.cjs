const fs = require('fs');
const path = require('path');
const d = path.join(__dirname, 'src', 'js');

const walk = (dir) => {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.js')) {
      let c = fs.readFileSync(p, 'utf8');
      c = c.replace(/\\\$/g, '$');
      fs.writeFileSync(p, c);
    }
  });
};
walk(d);
console.log('Fixed dollar signs');
