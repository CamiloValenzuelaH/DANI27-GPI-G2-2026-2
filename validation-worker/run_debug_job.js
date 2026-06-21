const { runValidationJob } = require('./src/validation');

(async () => {
  const jobData = {
    job_id: 'debug-run-001',
    file_path: '/shared/validation_jobs/442c1915-08d9-4ed0-813a-704976e48b7d__a40ad106-f374-4396-a10a-a9b04edf02ad__ISO27001_Anexo_A_93_Controles_Documento_Prueba.pdf',
    file_name: 'ISO27001_Anexo_A_93_Controles_Documento_Prueba.pdf',
    organization_id: '95c8377d-a0c8-4deb-a045-bccb31b63310',
    user_id: 'c89e0cc7-ffc4-459e-b445-e7485d093224',
    clause_refs: ['A.5.2','A.5.25','A.5.35','A.5.36','A.6.3'],
  };

  try {
    const res = await runValidationJob(jobData);
    console.log('JOB_DONE');
    // console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('JOB_ERROR', e && e.stack ? e.stack : e);
  }
})();
