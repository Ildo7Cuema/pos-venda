/** Identidade do software para SAF-T (AO) e documentos fiscais. */
export const SOFTWARE_NAME = 'KAMBA Money';
export const SOFTWARE_VERSION = '1.0.0';
/** NIF da CIMD — produtor do software no credenciamento AGT (não o NIF da loja cliente). */
export const SOFTWARE_PRODUCER_NIF = '5002827247';
/** Número atribuído pela AGT após validação do programa. Substituir quando for emitido. */
export const SOFTWARE_VALIDATION_NUMBER = '31.1/AGT20';

/** ProductID AGT: nome da aplicação / NIF do produtor */
export const SOFTWARE_PRODUCT_ID = `${SOFTWARE_NAME}/${SOFTWARE_PRODUCER_NIF}`;
