export async function setRoleFromKeycloakGroups (payload, meta, context, logger, services) {
  const {provider, providerPayload} = meta
  if (provider === 'keycloak' && providerPayload) {
    const {userInfo} = providerPayload
    const keys = Object.keys(userInfo || {})
    const keycloakGroups = keys.filter(key => key.startsWith('groups.')).map(key => userInfo[key])
    const institution = keycloakGroups.find(group => ['hsm', 'hfgo', 'hfgg', 'hst', 'kisd', 'ext'].includes(group))
    const status = keycloakGroups.find(group => ['staff', 'student', 'management'].includes(group))
    logger.info(`keycloakGroups: ${keycloakGroups.join(', ')}`)
    if (institution && status) {
      try {
        const groupId = `${institution}-${status}`
        logger.info(`groupId: ${groupId}`)
        payload.role = await getRoleForGroupId(groupId, services, context)
        logger.info(`roleId: ${payload.role}`)
      } catch (e) {
        logger.error(e.message)
        logger.error(e.stack)
      }
    }
  }
  return payload
}

export async function getRoleForGroupId (groupId, services, context) {
  const {ItemsService} = services
  const mappingService = new ItemsService('role_group_mapping', context)
  const results = await mappingService.readByQuery({
    filter: { groupId }
  })
  return results.map(mapping => mapping.roleId).shift()
}

export default ({filter, action}, {logger, services}) => {
  filter('auth.create', (payload, meta, context) => {
    logger.info('auth.create')
    return setRoleFromKeycloakGroups(payload, meta, context, logger, services)
  })

  filter('auth.update', (payload, meta, context) => {
    logger.info('auth.update')
    return setRoleFromKeycloakGroups(payload, meta, context, logger, services)
  })
};
