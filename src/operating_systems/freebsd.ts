import * as fs from 'fs'
import * as path from 'path'

import * as core from '@actions/core'

import * as architecture from '../architecture'
import * as action from '../action/action'
import * as vmModule from '../vm'
import {host} from '../host'
import * as os from '../operating_system'
import versions from '../version'

export default class FreeBsd extends os.OperatingSystem {
  constructor(arch: architecture.Architecture, version: string) {
    super('freebsd', arch, version)
  }

  get hypervisorUrl(): string {
    return host.hypervisor.getResourceUrl(this.architecture)
  }

  get ssHostPort(): number {
    return this.architecture.hypervisor.sshPort
  }

  get actionImplementationKind(): action.ImplementationKind {
    return this.architecture.resolve({
      x86_64: action.ImplementationKind.xhyve,
      default: action.ImplementationKind.qemu
    })
  }

  override async prepareDisk(
    diskImage: fs.PathLike,
    targetDiskName: fs.PathLike,
    resourcesDirectory: fs.PathLike
  ): Promise<void> {
    await os.convertToRawDisk(diskImage, targetDiskName, resourcesDirectory)
  }

  get virtualMachineImageReleaseVersion(): string {
    return versions.operating_system.freebsd
  }

  createVirtualMachine(
    hypervisorDirectory: fs.PathLike,
    resourcesDirectory: fs.PathLike,
    firmwareDirectory: fs.PathLike,
    configuration: os.VmConfiguration
  ): vmModule.Vm {
    core.debug('Creating FreeBSD VM')

    if (this.architecture.kind !== architecture.Kind.x86_64) {
      throw Error(
        `Not implemented: FreeBSD guests are not implemented on ${this.architecture.name}`
      )
    }

    const config: vmModule.Configuration = {
      ...configuration,

      ssHostPort: this.ssHostPort,
      firmware: path.join(
        firmwareDirectory.toString(),
        host.hypervisor.firmwareFile
      ),

      // qemu
      cpu: this.architecture.cpu,
      accelerator: this.architecture.accelerator,
      machineType: this.architecture.machineType,

      // xhyve
      uuid: this.uuid
    }

    return new host.vmModule.FreeBsd(
      hypervisorDirectory,
      resourcesDirectory,
      this.architecture,
      config
    )
  }
}
