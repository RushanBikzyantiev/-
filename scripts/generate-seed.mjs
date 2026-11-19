import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stages, lessonCatalog, freeLessons, premiumLessons, courseSchemaSql } from '../course-data.js';
import { schemaSql } from '../content.js';

const quote = value => `'${String(value).replaceAll("'", "''")}'`;
const lines = ['begin;', 'set standard_conforming_strings = on;'];

for (const stage of stages) {
  lines.push(`insert into public.course_stages(id,slug,title,description,outcome,position,is_free) values (${stage.id},${quote(stage.slug)},${quote(stage.title)},${quote(stage.description)},${quote(stage.outcome)},${stage.id},${stage.free}) on conflict (id) do update set slug=excluded.slug,title=excluded.title,description=excluded.description,outcome=excluded.outcome,position=excluded.position,is_free=excluded.is_free;`);
}
for (const lesson of lessonCatalog) {
  lines.push(`insert into public.lesson_catalog(id,stage_id,position,title,topic,description) values (${quote(lesson.id)},${lesson.stage},${lesson.position},${quote(lesson.title)},${quote(lesson.topic)},${quote(lesson.description)}) on conflict (id) do update set stage_id=excluded.stage_id,position=excluded.position,title=excluded.title,topic=excluded.topic,description=excluded.description;`);
}
for (const lesson of [...freeLessons, ...premiumLessons]) {
  const lessonSchema = lesson.stage === 1 ? schemaSql : courseSchemaSql;
  lines.push(`insert into public.lesson_content(lesson_id,theory,task,hint,starter,solution,schema_sql) values (${quote(lesson.id)},${quote(lesson.theory)},${quote(lesson.task)},${quote(lesson.hint)},${quote(lesson.starter)},${quote(lesson.solution)},${quote(lessonSchema)}) on conflict (lesson_id) do update set theory=excluded.theory,task=excluded.task,hint=excluded.hint,starter=excluded.starter,solution=excluded.solution,schema_sql=excluded.schema_sql;`);
}
lines.push('commit;');

const output = resolve(process.argv[2] || '/workspace/work/sql-course-seed.sql');
writeFileSync(output, lines.join('\n'), { mode: 0o600 });
console.log(`Created private SQL seed for ${stages.length} stages and ${lessonCatalog.length} lessons at ${output}`);
