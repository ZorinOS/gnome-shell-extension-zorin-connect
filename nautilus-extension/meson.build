# SPDX-FileCopyrightText: Zorin Connect Developers https://github.com/ZorinOS/gnome-shell-extension-zorin-connect
#
# SPDX-License-Identifier: GPL-2.0-or-later

# Nautilus Extension
if get_option('nautilus')
  install_data(
    'nautilus-zorin-connect.py',
    install_dir: join_paths(datadir, 'nautilus-python', 'extensions')
  )
endif

# Nemo Extension
if get_option('nemo')
  install_data(
    'nautilus-zorin-connect.py',
    rename: join_paths(datadir, 'nemo-python', 'extensions', 'nemo-zorin-connect.py')
  )
endif

